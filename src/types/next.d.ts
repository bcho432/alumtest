// Remove all custom Next.js type declarations

import { NextRouter } from 'next/router';
import { ReactNode } from 'react';

declare module 'next/navigation' {
  export function useRouter(): NextRouter;
  export function useParams(): { [key: string]: string };
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
  export function useSelectedLayoutSegment(): string | null;
  export function useSelectedLayoutSegments(): string[];
}

declare module 'next/link' {
  import { ComponentProps } from 'react';
  export interface LinkProps extends Omit<ComponentProps<'a'>, 'href'> {
    href: string;
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
    children: ReactNode;
  }
  export default function Link(props: LinkProps): JSX.Element;
}

declare module 'next/router' {
  export interface Router {
    push(url: string): Promise<boolean>;
    replace(url: string): Promise<boolean>;
    back(): void;
    pathname: string;
    query: Record<string, string | string[]>;
  }

  export function useRouter(): Router;
}

declare module 'next' {
  export interface NextRouter {
    push: (url: string | { pathname: string; query?: Record<string, string | number> }) => Promise<boolean>;
    replace: (url: string | { pathname: string; query?: Record<string, string | number> }) => Promise<boolean>;
    back: () => void;
    pathname: string;
    query: Record<string, string | string[]>;
    asPath: string;
  }
  export interface NextPage<P = {}, IP = P> {
    getInitialProps?: (context: any) => Promise<any>;
  }
} 