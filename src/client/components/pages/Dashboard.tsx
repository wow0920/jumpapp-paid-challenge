import { Avatar, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Navbar, NavbarBrand, NavbarContent, User } from "@heroui/react";
import { useSession } from "../providers/SessionProvider";
import { MdLogout } from "react-icons/md";
import { useModal } from "../providers/ModalProvider";
import ThemeSwitch from "../ThemeSwitch";

export default function Dashboard() {
  const { logout, currentUser } = useSession();
  const { showModal } = useModal();

  const handleLogout = () => {
    showModal({
      title: "Are you sure you want to sign out?",
      onOK: logout,
    });
  };

  return (
    <>
      <Navbar isBordered>
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
                name={currentUser?.name}
                size="sm"
                src={currentUser?.picture}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="asdf">
                <User avatarProps={{ src: currentUser?.picture }} description={currentUser?.email} name={currentUser?.name} />
              </DropdownItem>
              <DropdownItem key="signout" startContent={<MdLogout />} color="danger" onClick={handleLogout}>
                Sign Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarContent>
        <ThemeSwitch />
      </Navbar>
    </>
  );
}
