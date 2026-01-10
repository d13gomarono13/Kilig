import {makeScene2D, Rect, Circle, Txt} from '@revideo/2d';
import {createRef, all, waitFor} from '@revideo/core';

export default makeScene2D(function* (view) {
  const rect = createRef<Rect>();
  const circle = createRef<Circle>();
  const text = createRef<Txt>();

  view.add(
    <>
      <Rect
        ref={rect}
        size={200}
        fill="#FFE66D" // Neo-yellow
        stroke="black"
        lineWidth={4}
      />
      <Circle
        ref={circle}
        size={150}
        fill="#4ECDC4" // Neo-blue
        stroke="black"
        lineWidth={4}
        x={-300}
      />
      <Txt
        ref={text}
        text="KILIG"
        fontFamily="Space Grotesk"
        fontWeight={700}
        fontSize={80}
        fill="black"
        y={200}
        opacity={0}
      />
    </>
  );

  yield* all(
    rect().rotation(360, 2),
    circle().position.x(300, 2),
    circle().scale(1.5, 2)
  );
  
  yield* text().opacity(1, 0.5);
  yield* text().scale(1.2, 0.5);
  
  yield* waitFor(1);
});
