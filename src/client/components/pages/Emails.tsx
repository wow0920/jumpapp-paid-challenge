import { addToast, Button, getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { Category, Email } from "../../utils/types";
import { FaArrowLeft } from "react-icons/fa";
import { useEffect, useState } from "react";
import axios from "axios";

const dateRenderer = (val) => new Date(val).toDateString();
const summaryRenderer = (val) => (val?.length > 80 ? val?.substring(0, 80) + "..." : val);

const columns = [
  { name: "sender", title: "Sender" },
  { name: "subject", title: "Subject" },
  { name: "summary", title: "Summary", renderer: summaryRenderer },
  { name: "receivedAt", title: "Date", renderer: dateRenderer },
  { name: "actions", title: "Actions" },
];

export default function ({ category, onBack }: { category: Category; onBack: any }) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [_isLoading, setIsLoading] = useState(false);

  const fetchEmails = async (forceRefresh = true) => {
    if (forceRefresh) {
      setIsLoading(true);
    }
    try {
      const { data } = await axios.get(`/api/emails/${category.id}?seed=${Math.random()}`);
      setEmails(data);
    } catch (e) {
      console.error(e);
      addToast({ title: "Error", color: "danger", description: e.message ?? "Error occured while fetching emails." });
    } finally {
      setIsLoading(false);
    }
  };

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
      <Table isHeaderSticky>
        <TableHeader columns={columns}>{(column) => <TableColumn key={column.name}>{column.title}</TableColumn>}</TableHeader>
        <TableBody emptyContent="No emails found" items={emails}>
          {(item: Email) => (
            <TableRow key={item.id}>
              {(columnKey) => {
                const column = columns.find(({ name }) => name === columnKey);
                return <TableCell>{column.renderer ? column.renderer(item[columnKey]) : getKeyValue(item, columnKey)}</TableCell>;
              }}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
