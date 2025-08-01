import { Button, User } from "@heroui/react";
import { useSession } from "../providers/SessionProvider";

export default function Dashboard() {
  const { logout, currentUser } = useSession();
  return (
    <>
      <Button onPressUp={logout}>Log out</Button>
      <User avatarProps={{ src: currentUser?.picture }} description={currentUser?.email} name={currentUser?.name} />
    </>
  );
}
