import { useEffect, type ReactNode } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "default" | "wide";
  panelClassName?: string;
};

function Modal({ isOpen, onClose, children, size = "default", panelClassName }: ModalProps) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // If the modal shouldn't be shown, render nothing
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 1. Dark Backdrop Overlay */}
      <input
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
        type="button"
        tabIndex={-1}
        aria-label="Close modal backdrop"
        aria-hidden="true"
      />

      {/* 2. Modal Content Container */}
      <div
        className={`bg-secondary-bg relative z-10 w-full ${size === "wide" ? "max-w-xl" : "max-w-md"} rounded-lg p-6 shadow-xl transition-all ${panelClassName || 'max-w-md'}`}
      >
        {/* Close Button (X) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
          aria-label="Close modal"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* 3. Dynamic Content Slot */}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
