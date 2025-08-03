import { useSession } from "../providers/SessionProvider";
import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import { FcGoogle } from "react-icons/fc";
import ThemeSwitch from "../ThemeSwitch";

export default function Login() {
  const { login, loading } = useSession();

  return (
    <div className="m-auto">
      <Card className="p-4">
        <CardHeader className="font-bold text-2xl justify-center gap-5">
          AI Email Sorter
          <ThemeSwitch />
        </CardHeader>
        <CardBody>
          <p>Sign in to manage your emails with AI</p>
        </CardBody>
        <Button disabled={loading} onPress={() => login()}>
          Sign in with
          <FcGoogle className="text-2xl" />
        </Button>
      </Card>
    </div>
  );
}
