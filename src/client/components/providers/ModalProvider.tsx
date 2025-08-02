import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@heroui/react";

interface ModalOptions {
  title?: ReactNode;
  body?: ReactNode;
  ok?: string;
  cancel?: string;
  isDismissable?: boolean;
  hideCloseButton?: boolean;
  isKeyboardDismissDisabled?: boolean;
  onOK?: () => void | Promise<void>;
}

interface ModalObject {
  showModal: (options?: ModalOptions) => void;
}

const ModalContext = createContext<ModalObject>({
  showModal: () => {},
});

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [modalProps, setModalProps] = useState<ModalOptions>({});

  const showModal = useCallback((options: ModalOptions = {}) => {
    setModalProps(options);
    onOpen();
  }, []);

  return (
    <ModalContext.Provider value={{ showModal }}>
      <>
        {children}
        <Modal {...modalProps} backdrop="blur" title="asdf" isOpen={isOpen} onOpenChange={onOpenChange}>
          <ModalContent>
            {(onClose) => (
              <>
                {modalProps.title && <ModalHeader className="justify-center">{modalProps.title}</ModalHeader>}
                {modalProps.body && <ModalBody>{modalProps.body}</ModalBody>}
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    {modalProps.cancel || "Cancel"}
                  </Button>
                  <Button
                    color="primary"
                    onPress={async () => {
                      if (modalProps.onOK) {
                        await modalProps.onOK();
                      }
                      onClose();
                    }}
                  >
                    {modalProps.ok || "OK"}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </>
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);
