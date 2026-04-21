import NextImage from "next/image";
import type { ComponentProps } from "react";

type ProcessedImage = {
  src: string;
  width: number;
  height: number;
  blurDataURL?: string;
};

type WithProcessed = { image: ProcessedImage; alt: string } & Omit<
  ComponentProps<typeof NextImage>,
  "src" | "width" | "height" | "alt"
>;

export function ImageWithBlur(
  props: WithProcessed | ComponentProps<typeof NextImage>,
) {
  if ("image" in props && props.image) {
    const { image, alt, ...rest } = props;
    return (
      <NextImage
        src={image.src}
        width={image.width}
        height={image.height}
        placeholder={image.blurDataURL ? "blur" : undefined}
        blurDataURL={image.blurDataURL}
        alt={alt}
        className="rounded-lg"
        {...rest}
      />
    );
  }
  return <NextImage {...(props as ComponentProps<typeof NextImage>)} />;
}
