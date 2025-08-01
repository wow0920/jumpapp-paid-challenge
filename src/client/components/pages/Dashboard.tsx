import { Button } from "@heroui/react";
import { useSession } from "../providers/SessionProvider";

export default function Dashboard() {
  const { logout, currentUser } = useSession();
  return (
    <>
      <Button onPressUp={logout}>Log out</Button>
      <div>{currentUser?.name}</div>
      <div>{currentUser?.email}</div>
    </>
  );
}
