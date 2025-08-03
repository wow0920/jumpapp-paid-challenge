import { Avatar, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Navbar, NavbarBrand, NavbarContent, Tab, Tabs, User } from "@heroui/react";
import { useSession } from "../providers/SessionProvider";
import { MdLogout, MdDeleteForever } from "react-icons/md";
import { useModal } from "../providers/ModalProvider";
import ThemeSwitch from "../ThemeSwitch";
import { Account } from "../../utils/types";
import { DropdownSection } from "@heroui/react";
import { IoMdPersonAdd } from "react-icons/io";
import Categories from "./Categories";

export default function Dashboard() {
  const { login, logout, currentUser } = useSession();
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
                name={currentUser?.accounts[0]?.name}
                size="sm"
                src={currentUser?.accounts[0]?.picture}
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
        </NavbarContent>
        <ThemeSwitch />
      </Navbar>
      <div className="max-w-[1024px] m-auto flex flex-col flex-1 w-full p-6 gap-4">
        <Categories />
      </div>
    </>
  );
}
