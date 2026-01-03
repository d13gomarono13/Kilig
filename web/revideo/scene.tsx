/** @jsxImportSource @revideo/2d/lib */
import {makeScene2D} from '@revideo/2d';
import {Circle, Txt} from '@revideo/2d';
import {createRef, all} from '@revideo/core';

export default makeScene2D('scene', function* (view) {
  const circle = createRef<Circle>();
  const text = createRef<Txt>();

  view.add(
    <>
      <Circle
        ref={circle}
        width={240}
        height={240}
        fill={'#e13238'}
        opacity={0}
      />
      <Txt
        ref={text}
        text={'Revideo'}
        fill={'white'}
        fontFamily={'Inter'}
        fontWeight={900}
        fontSize={48}
        opacity={0}
      />
    </>,
  );

  yield* all(
    circle().opacity(1, 1),
    circle().scale(1.2, 1),
    text().opacity(1, 1),
  );
  yield* circle().fill('#32e138', 1);
  yield* text().text('Fast & Programmatic', 1);
});