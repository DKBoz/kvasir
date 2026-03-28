import { Inter, Nunito, Baloo_2 } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";
import "./animations.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

const baloo2 = Baloo_2({
  subsets: ["latin"],
  variable: "--font-baloo2",
});

export const metadata = {
  title: "Kvasir — Learn English",
  description: "Master English through immersive lessons and games",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${nunito.variable} ${baloo2.variable} h-full`}
    >
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}