import React from 'react';
import toast, { Toaster, ToastBar } from 'react-hot-toast';
import toast_error from 'src/assets/toast_error.png'
import toast_loading from 'src/assets/toast_loading.png'
import toast_success from 'src/assets/toast_success.png'
const CustomToast: React.FC = () => {
  return (
    <Toaster
      containerStyle={{
        background: 'transparent',
        boxShadow: 'none',
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ message }) => (
            <div
              className={`
                ${t.visible ? 'animate-enter' : 'animate-leave'}
                max-w-lg min-w-[200px] w-96 bg-[#211e20] shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5
              `}
            >
              <div className="flex items-center p-1">
                <div className="flex-shrink-0">
                  <div className='h-16 w-16 object-contain'>
                    {t.type === 'error' && (
                      <img
                        src={toast_error}
                        alt={`error ${message}`}
                      />
                    )}
                    {t.type === 'success' && (
                      <img
                        src={toast_success}
                        alt={`success ${message}`}
                      />
                    )}
                    {t.type === 'loading' && (
                      <img
                        src={toast_loading}
                        alt={`loading ${message}`}
                      />
                    )}
                  </div>
                </div>
                <div className="flex-grow">
                  <p className="text-sm font-medium text-[#e9efec]">
                    {message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toast.dismiss(t.id)}
                  className="p-2 rounded-md text-sm font-medium text-[#e9efec] hover:bg-[#504945] focus:outline-none focus:ring-2 focus:ring-[#504945] transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}

export default CustomToast;