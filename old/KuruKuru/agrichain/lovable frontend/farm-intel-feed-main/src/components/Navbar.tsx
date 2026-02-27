import { Sprout } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

const Navbar = () => {
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <Sprout className="h-5 w-5 text-primary-foreground" />
      </div>
      <span className="font-display text-xl font-bold text-foreground">AgriChain</span>
      <div className="ml-auto">
        <LanguageSwitcher />
      </div>
    </div>
  );
};

export default Navbar;
