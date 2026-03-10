import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAuthSession } from "@/lib/auth";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Link from "next/link";
import SignOutButton from "../auth/SignOutButton";
import { redirect } from "next/navigation";

export default async function Navbar() {
  const session = await getAuthSession();

  return (
    <nav className="flex justify-between items-center py-2 px-4 sm:px-16 border-b">
      <Link href="/">
        <h3 className="font-semibold text-lg tracking-tight">ShipFast</h3>
      </Link>

      {session ? (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar>
              <AvatarImage src={session.user?.image || ""} alt={session.user.name || ""} />
              <AvatarFallback>
                {session.user.name
                  ?.split(" ")
                  .map((word: string) => word[0].toUpperCase())
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="font-semibold">{session.user.name}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/subscription">
              <DropdownMenuItem className="cursor-pointer">
                Subscriptions
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem>
              <SignOutButton />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex gap-4">
          <Link href="/login">
            <button className="text-sm font-medium hover:underline">Login</button>
          </Link>
          <Link href="/signup">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
              Sign Up
            </button>
          </Link>
        </div>
      )}
    </nav>
  );
}
