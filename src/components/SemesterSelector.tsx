import { useState, useEffect } from 'react';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Semester {
  id: number;
  name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status: string;
}

interface SemesterSelectorProps {
  hostelId: number | null;
  onSemesterChange?: (semesterId: number | null, semester?: Semester | null) => void;
  className?: string;
  selectedSemesterId?: number | null;
  includeAllOption?: boolean;
}

export const SemesterSelector: React.FC<SemesterSelectorProps> = ({
  hostelId,
  onSemesterChange,
  className,
  selectedSemesterId: controlledSemesterId,
  includeAllOption = false,
}) => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [currentSemester, setCurrentSemester] = useState<Semester | null>(null);
  const [internalSelectedId, setInternalSelectedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isControlled = controlledSemesterId !== undefined;
  const effectiveSelectedId = isControlled ? controlledSemesterId ?? null : internalSelectedId;

  useEffect(() => {
    if (hostelId) {
      fetchCurrentSemester();
      fetchAllSemesters();
    } else {
      setCurrentSemester(null);
      setSemesters([]);
      if (!isControlled) {
        setInternalSelectedId(null);
      }
    }
  }, [hostelId]);

  useEffect(() => {
    if (!isControlled && currentSemester && internalSelectedId === null && !includeAllOption) {
      setInternalSelectedId(currentSemester.id);
      onSemesterChange?.(currentSemester.id, currentSemester);
    }
  }, [currentSemester, internalSelectedId, isControlled, includeAllOption, onSemesterChange]);

  useEffect(() => {
    if (isControlled) {
      // No need to sync internal state when component is controlled
      return;
    }
    if (controlledSemesterId !== undefined) {
      setInternalSelectedId(controlledSemesterId ?? null);
    }
  }, [controlledSemesterId, isControlled]);

  const fetchCurrentSemester = async () => {
    if (!hostelId) return;

    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.SEMESTERS.CURRENT}/${hostelId}/current`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success) {
        setCurrentSemester(data.semester || null);
      }
    } catch (err) {
      console.error('Error fetching current semester:', err);
    }
  };

  const fetchAllSemesters = async () => {
    if (!hostelId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_CONFIG.ENDPOINTS.SEMESTERS.LIST_BY_HOSTEL}/${hostelId}`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success) {
        setSemesters(data.semesters || []);
      }
    } catch (err) {
      console.error('Error fetching semesters:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resolveSemesterById = (id: number | null): Semester | null => {
    if (id === null) return null;
    if (currentSemester && currentSemester.id === id) {
      return currentSemester;
    }
    return semesters.find((s) => s.id === id) ?? null;
  };

  const handleChange = (value: string) => {
    let nextSemesterId: number | null = null;

    if (value !== 'all') {
      const parsed = parseInt(value, 10);
      nextSemesterId = Number.isNaN(parsed) ? null : parsed;
    }

    if (!isControlled) {
      setInternalSelectedId(nextSemesterId);
    }

    onSemesterChange?.(nextSemesterId, resolveSemesterById(nextSemesterId));
  };

  if (!hostelId || semesters.length === 0) {
    return null;
  }

  const selectValue =
    effectiveSelectedId === null
      ? includeAllOption
        ? 'all'
        : currentSemester
        ? currentSemester.id.toString()
        : 'all'
      : effectiveSelectedId.toString();

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-600" />
        <label className="text-sm font-medium text-gray-700">Semester:</label>
        <Select
          value={selectValue}
          onValueChange={handleChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select semester..." />
          </SelectTrigger>
          <SelectContent>
            {includeAllOption && (
              <SelectItem value="all">All semesters</SelectItem>
            )}
            {currentSemester && (
              <SelectItem value={currentSemester.id.toString()}>
                {currentSemester.name} {currentSemester.academic_year} (Current)
              </SelectItem>
            )}
            {semesters
              .filter(s => !s.is_current)
              .map((semester) => (
                <SelectItem key={semester.id} value={semester.id.toString()}>
                  {semester.name} {semester.academic_year}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};





