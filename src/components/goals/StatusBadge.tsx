interface StatusBadgeProps {
  status: 'planned' | 'ongoing' | 'paused' | 'completed' | 'abandoned';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    planned: {
      label: 'Planned',
      bg: 'bg-gray-200 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300'
    },
    ongoing: {
      label: 'Ongoing',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-300'
    },
    paused: {
      label: 'Paused',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-300'
    },
    completed: {
      label: 'Completed',
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-300'
    },
    abandoned: {
      label: 'Abandoned',
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-300'
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
