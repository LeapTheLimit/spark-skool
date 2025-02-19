import { Route } from 'next';

export type NavigationItem = {
  name: string;
  href: Route;
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
}; 