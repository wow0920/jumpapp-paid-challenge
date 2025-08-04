import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalProps, useDisclosure } from "@heroui/react";

interface ModalOptions {
  title?: ReactNode;
  body?: ReactNode;
  ok?: string;
  cancel?: string;
  hideFooter?: boolean;
  onOK?: () => void | Promise<void>;
  props?: Partial<ModalProps>;
  okColor?: "danger" | "primary" | "secondary" | "success" | "warning" | "default";
  cancelColor?: "danger" | "primary" | "secondary" | "success" | "warning" | "default";
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
        <Modal {...modalProps.props} backdrop="blur" isOpen={isOpen} onOpenChange={onOpenChange} scrollBehavior="inside">
          <ModalContent>
            {(onClose) => (
              <>
                {modalProps.title && <ModalHeader className="justify-center">{modalProps.title}</ModalHeader>}
                {modalProps.body && <ModalBody itemRef="">{modalProps.body}</ModalBody>}
                {!modalProps.hideFooter && (
                  <ModalFooter>
                    <Button color={modalProps.cancelColor ?? "default"} type="button" variant="light" onPress={onClose}>
                      {modalProps.cancel || "Cancel"}
                    </Button>
                    <Button
                      color={modalProps.okColor ?? "primary"}
                      type="submit"
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
                )}
              </>
            )}
          </ModalContent>
        </Modal>
      </>
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);
