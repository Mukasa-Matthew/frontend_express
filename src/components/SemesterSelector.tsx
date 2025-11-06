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
  onSemesterChange?: (semesterId: number | null) => void;
  className?: string;
}

export const SemesterSelector: React.FC<SemesterSelectorProps> = ({
  hostelId,
  onSemesterChange,
  className
}) => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [currentSemester, setCurrentSemester] = useState<Semester | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (hostelId) {
      fetchCurrentSemester();
      fetchAllSemesters();
    } else {
      setCurrentSemester(null);
      setSemesters([]);
    }
  }, [hostelId]);

  useEffect(() => {
    if (currentSemester && !selectedSemesterId) {
      setSelectedSemesterId(currentSemester.id);
      onSemesterChange?.(currentSemester.id);
    }
  }, [currentSemester]);

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

  const handleChange = (value: string) => {
    const semesterId = value === 'current' ? null : parseInt(value);
    setSelectedSemesterId(semesterId);
    onSemesterChange?.(semesterId);
  };

  if (!hostelId || semesters.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-600" />
        <label className="text-sm font-medium text-gray-700">Semester:</label>
        <Select
          value={selectedSemesterId?.toString() || 'current'}
          onValueChange={handleChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select semester..." />
          </SelectTrigger>
          <SelectContent>
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





