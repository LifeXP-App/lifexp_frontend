/* ===========================
   NEW GOAL MODAL
   =========================== */
import { useState } from "react";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";


interface NewGoalModalProps {
  isOpen: boolean;
  isEdit?: boolean;
  goalCompleted?: boolean;
  onClose: () => void;
  onSubmit: (goal: {
    title: string;
    description: string;
    finishBy: string;
  }) => void;

  initialGoal?: {                
    title?: string;
    description?: string;
    finishBy?: string;          
  };
}


export default function NewGoalModal({
  isOpen,
  isEdit = false,
  goalCompleted = false,
  onClose,
  onSubmit,
  initialGoal, 
}: NewGoalModalProps) {
  const [title, setTitle] = useState(initialGoal?.title ?? "");
  const [description, setDescription] = useState(initialGoal?.description ?? "");

  const [selectedPeriod, setSelectedPeriod] = useState<
    "1w" | "2w" | "1m" | "6m" | "custom" | null
  >(() => {
    const fb = initialGoal?.finishBy;

    if (!fb) return null;
    if (fb === "1w" || fb === "2w" || fb === "1m" || fb === "6m") return fb;
    return "custom"; // if it's a date
  });

  const [showCalendar, setShowCalendar] = useState(() => {
    const fb = initialGoal?.finishBy;
    return !!fb && fb !== "1w" && fb !== "2w" && fb !== "1m" && fb !== "6m";
  });

  const [customDate, setCustomDate] = useState(() => {
    const fb = initialGoal?.finishBy;
    if (!fb) return "";
    if (fb === "1w" || fb === "2w" || fb === "1m" || fb === "6m") return "";
    return fb; // date string
  });

  if (!isOpen) return null;


  const handlePeriodSelect = (period: "1w" | "2w" | "1m" | "6m" | "custom") => {
    setSelectedPeriod(period);
    if (period === "custom") {
      setShowCalendar(true);
    } else {
      setShowCalendar(false);
      setCustomDate("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finishByDate = "";
    if (selectedPeriod === "custom") {
      finishByDate = customDate;
    } else if (selectedPeriod) {
      finishByDate = selectedPeriod;
    }

    onSubmit({
      title,
      description,
      finishBy: finishByDate,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setSelectedPeriod(null);
    setShowCalendar(false);
    setCustomDate("");
  };

  const isFormValid =
    title.trim() !== "" &&
    selectedPeriod !== null &&
    (selectedPeriod !== "custom" || customDate !== "");

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30  bg-opacity-50 z-40 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-gray-100 dark:bg-dark-2 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden dark:border dark:border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <h2 className="text-xl  font-bold text-black dark:text-white">
              {isEdit ? "Edit Goal Details" : "Create New Goal"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors cursor-pointer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} >
            {/* Title Input */}
            <div  className="px-6 pt-6">

           
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-black dark:text-white">
                What {goalCompleted ? "did you" : "What do you want to"} achieve?
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Learn to play guitar"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-3 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Description Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-black dark:text-white">
                Describe your goal{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about your goal..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-3 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              />
            </div>
            {!goalCompleted && (
                <>
            {/* Finish By Section */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3 text-black dark:text-white">
                Finish by
              </label>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { value: "1w", label: "1w" },
                  { value: "2w", label: "2w" },
                  { value: "1m", label: "1m" },
                  { value: "6m", label: "6m" },
                  { value: "custom", label: "Custom" },
                ].map((period) => (
                  <button
                    key={period.value}
                    type="button"
                    onClick={() =>
                      handlePeriodSelect(
                        period.value as "1w" | "2w" | "1m" | "6m" | "custom",
                      )
                    }
                    className={`
                      aspect-square rounded-full text-sm font-semibold transition-all cursor-pointer
                      flex items-center  justify-center
                      ${
                        selectedPeriod === period.value
                          ? "bg-black dark:bg-gray-700 text-white"
                          : "bg-gray-200 dark:bg-dark-3 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-800"
                      }
                    `}
                  >
                    {period.value === "custom" ? (
                      <CalendarDaysIcon className="w-5 h-5" />
                    ) : (
                      period.label
                    )}
                  </button>
                ))}
              </div>
            </div>

            

            {/* Calendar Picker */}
            {showCalendar && (
              <div>
                <label className="block text-sm font-semibold mb-2 text-black dark:text-white">
                  Select date
                </label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-3 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            )}
             
             </>
        )}
        </div>

            <div className="mt-4 p-6 w-full bg-white dark:bg-gray-900  border-t border-gray-200 dark:border-gray-800">
              {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid}
              className={`
                w-full py-3 rounded-2xl font-semibold text-white text-base active:opacity-80 transition-all
                ${
                  isFormValid
                    ? "cursor-pointer "
                    : "bg-gray-300 dark:bg-gray-700 opacity-50 cursor-not-allowed"
                }
              `}
              style={{background:"var(--rookie-primary)"}}
            >
              {}{isEdit ? "Save Changes" : "Create Goal"}
            </button>

            </div>
            
          </form>
        </div>
      </div>
    </>
  );
}