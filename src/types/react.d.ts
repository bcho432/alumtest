import { ReactNode } from 'react';

declare global {
  namespace JSX {
    interface Element extends ReactNode {}
  }
}

declare module 'react' {
  interface ReactNode {
    children?: ReactNode;
  }

  interface PropsWithChildren {
    children?: ReactNode;
  }

  interface PropsWithClassName {
    className?: string;
  }

  interface PropsWithOnClick {
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  }

  interface PropsWithDisabled {
    disabled?: boolean;
  }

  interface PropsWithLoading {
    loading?: boolean;
  }

  interface PropsWithError {
    error?: Error | null;
  }

  interface PropsWithData<T> {
    data?: T;
  }

  interface PropsWithId {
    id?: string;
  }

  interface PropsWithName {
    name?: string;
  }

  interface PropsWithValue {
    value?: string | number | boolean;
  }

  interface PropsWithPlaceholder {
    placeholder?: string;
  }

  interface PropsWithType {
    type?: string;
  }

  interface PropsWithVariant {
    variant?: string;
  }

  interface PropsWithSize {
    size?: string;
  }

  interface PropsWithIsLoading {
    isLoading?: boolean;
  }

  interface PropsWithOnChange {
    onChange?: (event: React.ChangeEvent<HTMLElement>) => void;
  }

  interface PropsWithOnSubmit {
    onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  }

  interface PropsWithOnKeyDown {
    onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
  }

  interface PropsWithOnKeyUp {
    onKeyUp?: (event: React.KeyboardEvent<HTMLElement>) => void;
  }

  interface PropsWithOnKeyPress {
    onKeyPress?: (event: React.KeyboardEvent<HTMLElement>) => void;
  }

  interface PropsWithOnFocus {
    onFocus?: (event: React.FocusEvent<HTMLElement>) => void;
  }

  interface PropsWithOnBlur {
    onBlur?: (event: React.FocusEvent<HTMLElement>) => void;
  }

  interface PropsWithOnMouseEnter {
    onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;
  }

  interface PropsWithOnMouseLeave {
    onMouseLeave?: (event: React.MouseEvent<HTMLElement>) => void;
  }

  interface PropsWithOnMouseOver {
    onMouseOver?: (event: React.MouseEvent<HTMLElement>) => void;
  }

  interface PropsWithOnMouseOut {
    onMouseOut?: (event: React.MouseEvent<HTMLElement>) => void;
  }

  interface PropsWithOnMouseDown {
    onMouseDown?: (event: React.MouseEvent<HTMLElement>) => void;
  }

  interface PropsWithOnMouseUp {
    onMouseUp?: (event: React.MouseEvent<HTMLElement>) => void;
  }

  interface PropsWithOnMouseMove {
    onMouseMove?: (event: React.MouseEvent<HTMLElement>) => void;
  }

  interface PropsWithOnMouseWheel {
    onMouseWheel?: (event: React.WheelEvent<HTMLElement>) => void;
  }

  interface PropsWithOnScroll {
    onScroll?: (event: React.UIEvent<HTMLElement>) => void;
  }

  interface PropsWithOnWheel {
    onWheel?: (event: React.WheelEvent<HTMLElement>) => void;
  }

  interface PropsWithOnTouchStart {
    onTouchStart?: (event: React.TouchEvent<HTMLElement>) => void;
  }

  interface PropsWithOnTouchMove {
    onTouchMove?: (event: React.TouchEvent<HTMLElement>) => void;
  }

  interface PropsWithOnTouchEnd {
    onTouchEnd?: (event: React.TouchEvent<HTMLElement>) => void;
  }

  interface PropsWithOnTouchCancel {
    onTouchCancel?: (event: React.TouchEvent<HTMLElement>) => void;
  }

  interface PropsWithOnDragStart {
    onDragStart?: (event: React.DragEvent<HTMLElement>) => void;
  }

  interface PropsWithOnDrag {
    onDrag?: (event: React.DragEvent<HTMLElement>) => void;
  }

  interface PropsWithOnDragEnd {
    onDragEnd?: (event: React.DragEvent<HTMLElement>) => void;
  }

  interface PropsWithOnDragEnter {
    onDragEnter?: (event: React.DragEvent<HTMLElement>) => void;
  }

  interface PropsWithOnDragLeave {
    onDragLeave?: (event: React.DragEvent<HTMLElement>) => void;
  }

  interface PropsWithOnDragOver {
    onDragOver?: (event: React.DragEvent<HTMLElement>) => void;
  }

  interface PropsWithOnDrop {
    onDrop?: (event: React.DragEvent<HTMLElement>) => void;
  }

  interface PropsWithOnAnimationStart {
    onAnimationStart?: (event: React.AnimationEvent<HTMLElement>) => void;
  }

  interface PropsWithOnAnimationEnd {
    onAnimationEnd?: (event: React.AnimationEvent<HTMLElement>) => void;
  }

  interface PropsWithOnAnimationIteration {
    onAnimationIteration?: (event: React.AnimationEvent<HTMLElement>) => void;
  }

  interface PropsWithOnTransitionEnd {
    onTransitionEnd?: (event: React.TransitionEvent<HTMLElement>) => void;
  }
} 