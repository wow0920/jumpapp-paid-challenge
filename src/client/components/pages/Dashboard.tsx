import {
  addToast,
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Navbar,
  NavbarBrand,
  NavbarContent,
  Tooltip,
  User,
} from "@heroui/react";
import { useSession } from "../providers/SessionProvider";
import { MdLogout } from "react-icons/md";
import { useModal } from "../providers/ModalProvider";
import ThemeSwitch from "../ThemeSwitch";
import { Account } from "../../utils/types";
import { DropdownSection } from "@heroui/react";
import { IoMdPersonAdd } from "react-icons/io";
import { FiRefreshCw } from "react-icons/fi";
import Categories from "./Categories";
import axios from "axios";
import { useEffect } from "react";

export default function Dashboard() {
  const { login, logout, currentUser, socket } = useSession();
  const { showModal } = useModal();

  const handleLogout = () => {
    showModal({
      title: "Are you sure you want to sign out?",
      onOK: logout,
    });
  };

  const handleSync = async () => {
    try {
      await axios.post("/api/gmail-sync");
      addToast({ title: "Started synchronizing your UNREAD emails...", color: "default" });
    } catch (e) {
      console.error(e);
      addToast({ title: "Error", color: "danger", description: e.response?.data?.error ?? e.message ?? "Error occured while syncing emails." });
    }
  };

  useEffect(() => {
    const socketHandler = async () => {
      addToast({ title: "A new email", description: "A new email was received!" });
    };
    socket.on("new_message", socketHandler);
    return () => {
      socket.off("new_message", socketHandler);
    };
  }, []);

  return (
    <>
      <Navbar isBordered maxWidth="xl">
        <NavbarBrand>
          <p className="font-bold text-inherit">AI Email Sorter</p>
        </NavbarBrand>
        <NavbarContent className="hidden sm:flex gap-4" justify="center"></NavbarContent>

        <NavbarContent as="div" justify="end">
          <Dropdown placement="bottom-end">
            <DropdownTrigger className="cursor-pointer">
              <Avatar
                isBordered
                as="button"
                className="transition-transform"
                color="secondary"
                name={currentUser?.accounts?.[0]?.name}
                size="sm"
                src={currentUser?.accounts?.[0]?.picture}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownSection showDivider>
                <DropdownItem key="add_new_account" startContent={<IoMdPersonAdd />} onClick={login}>
                  Add new account
                </DropdownItem>
              </DropdownSection>
              <DropdownSection showDivider>
                <>
                  {(currentUser?.accounts ?? []).map(({ id, picture, email, name }: Account) => (
                    <DropdownItem key={id}>
                      <User avatarProps={{ src: picture }} description={email} name={name} />
                    </DropdownItem>
                  ))}
                </>
              </DropdownSection>
              <DropdownSection>
                <DropdownItem key="signout" startContent={<MdLogout />} color="danger" onClick={handleLogout}>
                  Sign Out
                </DropdownItem>
              </DropdownSection>
            </DropdownMenu>
          </Dropdown>
          <Tooltip content="Sync" color="primary">
            <Button isIconOnly radius="full" variant="flat" color="primary" onPress={handleSync}>
              <FiRefreshCw className="text-lg" />
            </Button>
          </Tooltip>
          <ThemeSwitch />
        </NavbarContent>
      </Navbar>
      <div className="max-w-[1280px] m-auto flex flex-col flex-1 w-full p-6 gap-4 pb-20">
        <Categories />
      </div>
    </>
  );
}
