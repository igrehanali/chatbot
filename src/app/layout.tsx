import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { ChatbotsProvider } from "@/components/providers/chatbots-provider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Multi Chatbot Dashboard",
  description: "Personal multi-chatbot dashboard powered by OpenRouter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <ChatbotsProvider>{children}</ChatbotsProvider>
      </body>
    </html>
  );
}
