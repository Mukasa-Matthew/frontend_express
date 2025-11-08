import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, History } from 'lucide-react';

export interface SemesterPaymentSummary {
  semester_id: number | null;
  name: string | null;
  academic_year: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_current?: boolean;
  total_collected: number;
  total_expected: number;
  outstanding: number;
}

export interface SemesterPaymentsData {
  current: SemesterPaymentSummary | null;
  history: SemesterPaymentSummary[];
}

interface SemesterPaymentsSectionProps {
  title?: string;
  description?: string;
  data: SemesterPaymentsData;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

const formatCurrency = (value: number) =>
  `UGX ${Number(value || 0).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}`;

const formatStatus = (summary: SemesterPaymentSummary): string => {
  if (summary.total_expected <= 0) {
    return 'No target';
  }

  if (summary.outstanding <= 0) {
    return 'Fully Paid';
  }

  if (summary.total_collected > 0) {
    return 'Partial';
  }

  return 'Unpaid';
};

export const SemesterPaymentsSection = ({
  title = 'Semester Collections Overview',
  description = 'Track collections and outstanding amounts for each semester.',
  data,
  loading = false,
  error = null,
  emptyMessage = 'No semester payment history available yet.',
}: SemesterPaymentsSectionProps) => {
  const { current, history } = data;

  const renderHistoryRows = () => {
    if (!history.length) {
      return (
        <tr>
          <td colSpan={6} className="py-4 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </td>
        </tr>
      );
    }

    return history.map((item) => (
      <tr
        key={`${item.semester_id ?? item.name ?? 'unknown'}`}
        className={item.is_current ? 'bg-indigo-50/60 font-medium' : undefined}
      >
        <td className="px-4 py-3 text-sm text-gray-900">
          {item.name || '—'}
          {item.is_current ? (
            <span className="ml-2 inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
              Current
            </span>
          ) : null}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{item.academic_year || '—'}</td>
        <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(item.total_expected)}</td>
        <td className="px-4 py-3 text-sm text-emerald-700">{formatCurrency(item.total_collected)}</td>
        <td className="px-4 py-3 text-sm text-amber-700">{formatCurrency(item.outstanding)}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{formatStatus(item)}</td>
      </tr>
    ));
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Loading payment history...
          </CardContent>
        </Card>
      ) : (
        <>
          {current ? (
            <Card>
              <CardHeader className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Current Semester
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {current.name || 'Unnamed semester'}
                    {current.academic_year ? ` · ${current.academic_year}` : ''}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  <History className="h-4 w-4" />
                  Live Tracking
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Total Expected
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">
                      {formatCurrency(current.total_expected)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Collected
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-emerald-700">
                      {formatCurrency(current.total_collected)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Outstanding
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-amber-700">
                      {formatCurrency(current.outstanding)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Semester History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium text-gray-700">
                        Semester
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium text-gray-700">
                        Academic Year
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium text-gray-700">
                        Expected
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium text-gray-700">
                        Collected
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium text-gray-700">
                        Outstanding
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium text-gray-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {renderHistoryRows()}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default SemesterPaymentsSection;

