import {
  addToast,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Skeleton,
  Textarea,
  Tooltip,
} from "@heroui/react";
import { useEffect, useState } from "react";
import axios from "axios";
import { Category } from "../../utils/types";
import { MdAdd } from "react-icons/md";
import { FaCheck, FaEdit, FaTimes, FaTrashAlt } from "react-icons/fa";
import { useModal } from "../providers/ModalProvider";
import { IoSparkles } from "react-icons/io5";
import Emails from "./Emails";
import { useSession } from "../providers/SessionProvider";

const EditCategory = ({ category, isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState<string>(category?.name ?? "");
  const [description, setDescription] = useState<string>(category?.description ?? "");

  useEffect(() => {
    setName(category?.name ?? "");
    setDescription(category?.description ?? "");
  }, [category]);

  const generateCategory = async () => {
    setIsLoading(true);
    try {
      const { name, description } = await axios.post("/api/categories-ai").then(({ data }) => data);
      setName(name);
      setDescription(description);
    } catch (e) {
      console.error(e);
      addToast({ title: "Error", color: "danger", description: e.message ?? "Error occured while generating category." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    if (onClose) {
      onClose();
    }
  };

  const submitCategory = async (obj) => {
    setIsLoading(true);

    try {
      if (category?.id) {
        await axios.put(`/api/categories/${category.id}`, obj);
        addToast({ title: "Success", color: "success", description: "Category was successfully updated." });
      } else {
        await axios.post("/api/categories", obj);
        addToast({ title: "Success", color: "success", description: "Category was successfully created." });
      }
    } catch (e) {
      console.error(e);
      addToast({ title: "Error", color: "danger", description: e.message ?? "Error occured while saving category." });
    } finally {
      setIsLoading(false);
    }

    handleClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isOpen) {
      return;
    }

    submitCategory(Object.fromEntries(new FormData(e.currentTarget)));
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} backdrop="blur" scrollBehavior="inside">
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col">
            <p>{category?.id ? "Edit" : "Add"} Category</p>
          </ModalHeader>
          <ModalBody>
            {!category?.id && (
              <Button variant="flat" color="primary" isDisabled={isLoading} startContent={<IoSparkles />} onPress={generateCategory}>
                Generate using AI
              </Button>
            )}
            <Input
              isDisabled={isLoading}
              isRequired
              value={name}
              onChange={(e) => setName(e.target.value)}
              label="Name"
              name="name"
              placeholder="e.g., Work, Personal, Shopping"
              defaultValue={category?.name}
            />
            <Textarea
              isDisabled={isLoading}
              isRequired
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              label="Description"
              name="description"
              placeholder="Describe what emails should go in this category..."
              defaultValue={category?.description}
            />
          </ModalBody>
          <ModalFooter>
            <Button isDisabled={isLoading} type="button" color="default" startContent={<FaTimes />} onPress={handleClose}>
              Cancel
            </Button>
            <Button isDisabled={isLoading} type="submit" color="primary" startContent={<FaCheck />}>
              Save
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default function Categories() {
  const { socket } = useSession();
  const { showModal } = useModal();

  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = async (forceRefresh = true) => {
    if (forceRefresh) {
      setIsLoading(true);
    }
    try {
      const { data } = await axios.get(`/api/categories?seed=${Math.random()}`);
      setCategories(data);
    } catch (e) {
      console.error(e);
      addToast({ title: "Error", color: "danger", description: e.message ?? "Error occured while fetching categories." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    const socketHandler = async () => {
      await fetchCategories(false);
      addToast({ title: "Success", color: "success", description: "Emails were successfully synchronized." });
    };
    socket.on("sync_finished", socketHandler);
    return () => {
      socket.off("sync_finished", socketHandler);
    };
  }, []);

  const handleDeleteCategory = (id) => {
    showModal({
      title: "Delete Category",
      body: "Are you sure you want to delete this category? This action cannot be undone.",
      ok: "Delete",
      okColor: "danger",
      onOK: async () => {
        try {
          await axios.delete(`/api/categories/${id}`);
          addToast({ title: "Success", color: "success", description: "Category was successfully deleted." });
        } catch (e) {
          console.error(e);
          addToast({ title: "Error", color: "danger", description: e.message ?? "Error occured while deleting category." });
        } finally {
          fetchCategories();
        }
      },
    });
  };

  const handlEditCategory = (category) => {
    setEditCategory(category);
    setModalOpen(true);
  };

  const handleAddCategory = () => {
    setEditCategory(null);
    setModalOpen(true);
  };

  useEffect(() => {
    if (!modalOpen) {
      fetchCategories(false);
    }
  }, [modalOpen]);

  return (
    <>
      {!selectedCategory ? (
        <>
          <div className="flex justify-between">
            <h1>Email Categories</h1>
            <Button startContent={<MdAdd />} onPress={handleAddCategory} color="primary">
              New Category
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <>
                {new Array(6).map((_, i) => (
                  <Skeleton key={i} />
                ))}
              </>
            ) : (
              <>
                {(categories ?? []).map(({ id, name, description, emailCount }) => (
                  <Card key={id}>
                    <CardHeader className="justify-between font-bold ">
                      <Tooltip content={`Emails: ${emailCount}`}>
                        <Button
                          className="text-lg flex items-center gap-3"
                          variant="light"
                          onPress={() => setSelectedCategory({ id, name, description })}
                        >
                          <span>{name}</span>
                          {emailCount > 0 && <Chip size="sm">{emailCount}</Chip>}
                        </Button>
                      </Tooltip>
                      <div className="flex gap-1">
                        <Button radius="full" variant="light" size="sm" isIconOnly onPress={() => handlEditCategory({ id, name, description })}>
                          <FaEdit className="text-medium" />
                        </Button>
                        <Button radius="full" variant="light" size="sm" isIconOnly onPress={() => handleDeleteCategory(id)}>
                          <FaTrashAlt className="text-medium" />
                        </Button>
                      </div>
                    </CardHeader>
                    <Divider />
                    <CardBody className="text-sm p-5 opacity-70">{description}</CardBody>
                  </Card>
                ))}
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <Emails category={selectedCategory} onBack={() => setSelectedCategory(null)} />
        </>
      )}

      <EditCategory isOpen={modalOpen} category={editCategory} onClose={() => setModalOpen(false)} />
    </>
  );
}
