import {
  Accordion,
  AccordionItem,
  addToast,
  Button,
  Selection,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from "@heroui/react";
import { Category, Email } from "../../utils/types";
import { FaArrowLeft } from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";
import { TbMailOff, TbEye, TbTrash } from "react-icons/tb";
import axios from "axios";
import { useModal } from "../providers/ModalProvider";
import { useSession } from "../providers/SessionProvider";

const dateRenderer = (dateInput) => {
  function date2string() {
    const now = new Date();
    const date = new Date(dateInput);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours !== 1 ? "s" : ""} ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;

    if (days < 14) return `a week ago`;

    const optionsSameYear: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    const optionsWithYear: Intl.DateTimeFormatOptions = { ...optionsSameYear, year: "numeric" };

    const isSameYear = now.getFullYear() === date.getFullYear();
    return date.toLocaleDateString("en-US", isSameYear ? optionsSameYear : optionsWithYear);
  }

  return <div className="whitespace-nowrap">{date2string()}</div>;
};

const summaryRenderer = (text) => {
  const maxLength = 60;
  if (text.length <= maxLength) return text;
  const trimmed = text.slice(0, maxLength + 1);
  const lastSpace = trimmed.lastIndexOf(" ");
  return trimmed.slice(0, lastSpace) + "...";
};

export default function ({ category, onBack }: { category: Category; onBack: any }) {
  const { socket } = useSession();
  const { showModal } = useModal();
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));

  const selectedEmails = useMemo(() => (selectedKeys === "all" ? emails : emails.filter(({ id }) => selectedKeys.has(id))), [emails, selectedKeys]);

  const fetchEmails = async (forceRefresh = true) => {
    if (forceRefresh) {
      setIsLoading(true);
    }
    try {
      const { data } = await axios.get(`/api/emails/${category.id}?seed=${Math.random()}`);
      setEmails(data);
    } catch (e) {
      console.error(e);
      addToast({ title: "Error", color: "danger", description: e.response?.data?.error ?? e.message ?? "Error occured while fetching emails." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (emailId = null) => {
    if (!emailId && selectedEmails.length <= 0) {
      addToast({ title: "Error", color: "danger", description: "Please select at least one email to delete." });
      return;
    }
    try {
      await axios.delete(`/api/emails-db`, {
        data: {
          ids: emailId ? [emailId] : selectedEmails.map(({ id }) => id),
        },
      });
      await fetchEmails();
      addToast({ title: "Success", color: "success", description: "Deleted the emails successfully." });
    } catch (e) {
      console.error(e);
      addToast({ title: "Error", color: "danger", description: e.response?.data?.error ?? e.message ?? "Error occured while deleting." });
    }
  };

  const handleUnsubscribe = async (emailId = null) => {
    if (!emailId && selectedEmails.length <= 0) {
      addToast({ title: "Error", color: "danger", description: "Please select at least one email to unsubscribe." });
      return;
    }
    try {
      await axios.delete(`/api/emails`, {
        data: {
          ids: emailId ? [emailId] : selectedEmails.map(({ id }) => id),
        },
      });
      addToast({ title: "Success", color: "success", description: "Started unsubscribing..." });
    } catch (e) {
      console.error(e);
      addToast({ title: "Error", color: "danger", description: e.response?.data?.error ?? e.message ?? "Error occured while unsubscribing." });
    }
  };

  useEffect(() => {
    const socketHandler = async () => {
      addToast({ title: "Success", color: "success", description: "Unsubscribe was successfully synchronized." });
    };
    socket.on("unsubscribe_finished", socketHandler);
    return () => {
      socket.off("unsubscribe_finished", socketHandler);
    };
  }, []);

  const handleViewEmail = ({ subject, summary, body }: Email) => {
    showModal({
      title: subject,
      body: (
        <Accordion selectionMode="multiple" defaultExpandedKeys={["body"]}>
          <AccordionItem key="summary" title="Summary">
            {summary}
          </AccordionItem>
          <AccordionItem key="body" title="Body">
            <div dangerouslySetInnerHTML={{ __html: body.replace(/<a\b([^>]*?)>/gi, '<a$1 target="_blank" rel="noopener noreferrer">') }}></div>
          </AccordionItem>
        </Accordion>
      ),
      props: {
        size: "5xl",
      },
    });
  };

  const columns = useMemo(
    () => [
      {
        name: "sender",
        title: "Sender",
        getValue: (email) => ({ name: email.senderName, email: email.senderEmail }),
        renderer: ({ name, email }) => (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{name}</p>
            <p className="text-bold text-tiny capitalize text-default-400">{email}</p>
          </div>
        ),
      },
      { name: "subject", title: "Subject" },
      { name: "summary", title: "Summary", renderer: summaryRenderer },
      { name: "receivedAt", title: "Date", renderer: dateRenderer },
      {
        name: "actions",
        title: "Actions",
        getValue: (email) => email,
        renderer: (email) => (
          <div className="flex flex-row">
            <Tooltip content="Details">
              <Button isIconOnly variant="light" size="sm" radius="md" onPress={() => handleViewEmail(email)}>
                <TbEye className="text-lg" />
              </Button>
            </Tooltip>
            <Tooltip content="Delete" color="danger">
              <Button isIconOnly variant="light" size="sm" radius="md" color="danger" onPress={() => handleDelete(email.id)}>
                <TbTrash className="text-lg" />
              </Button>
            </Tooltip>
            <Tooltip content="Unsubscribe" color="danger">
              <Button isIconOnly variant="light" size="sm" radius="md" color="danger" onPress={() => handleUnsubscribe(email.id)}>
                <TbMailOff className="text-lg" />
              </Button>
            </Tooltip>
          </div>
        ),
      },
    ],
    []
  );

  useEffect(() => {
    fetchEmails();
  }, []);

  return (
    <>
      <div>
        <Button
          startContent={<FaArrowLeft />}
          onPress={() => {
            setEmails([]);
            onBack();
          }}
          variant="light"
        >
          Back
        </Button>
        <h1>{category.name}</h1>
        <h2 className="opacity-75">{category.description}</h2>
      </div>
      <Table
        isHeaderSticky
        selectionMode="multiple"
        topContent={
          <div className="flex justify-end items-center gap-4">
            <div>
              {selectedKeys === "all" || selectedKeys.size >= emails.length
                ? "All items selected"
                : `${selectedKeys.size} of ${emails.length} selected`}
            </div>
            <Button
              isDisabled={selectedEmails.length === 0}
              startContent={<TbTrash className="text-lg" />}
              color="danger"
              onPress={() => handleDelete()}
            >
              Delete
            </Button>
            <Button
              isDisabled={selectedEmails.length === 0}
              startContent={<TbMailOff className="text-lg" />}
              color="danger"
              onPress={() => handleUnsubscribe()}
            >
              Unsubscribe
            </Button>
          </div>
        }
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.name} align={column.name === "actions" ? "end" : "start"}>
              {column.title}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent="No emails found" items={emails} loadingContent={<Spinner />} loadingState={isLoading ? "loading" : "idle"}>
          {(item: Email) => (
            <TableRow key={item.id}>
              {(columnKey) => {
                const column = columns.find(({ name }) => name === columnKey);
                const value = column?.getValue ? column.getValue(item) : item[columnKey];
                return <TableCell>{column.renderer ? column.renderer(value) : value}</TableCell>;
              }}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
