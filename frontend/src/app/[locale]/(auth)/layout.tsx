import TopBar from "@/components/topBar";
import QuickNav from "@/components/dashboard/quickNav";
import { Props } from "next/script";

export default async function RootLayout({ children }: Props) {
  return <div>   <QuickNav variant="sidebar" />{children}</div>;
}
