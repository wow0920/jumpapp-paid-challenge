export type Account = {
  id: string;
  email: string;
  name?: string;
  picture?: string;
};

export type User = {
  id: string;
  email: string;
  accounts: Account[];
};

export type Category = {
  id: string;
  name: string;
  description: string;
  emailCount?: number;
};
