import TopBar from "@/components/topBar";
import { Props } from "next/script";

export default async function RootLayout({ children }: Props) {
  return <div>{children}</div>;
}
