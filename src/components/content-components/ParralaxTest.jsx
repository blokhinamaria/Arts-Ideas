import { ParallaxBanner } from "react-scroll-parallax";

export default function MyParallax() {
  return (
    <ParallaxBanner
      layers={[
        { image: '/image.jpg', speed: -20 },
        { image: '/image2.png', speed: -10 },
      ]}
      className="aspect-[2/1]"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <h1 className="text-8xl text-white font-thin">Hello World!</h1>
      </div>
    </ParallaxBanner>
  );
}