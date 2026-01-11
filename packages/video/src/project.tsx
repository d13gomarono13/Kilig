import { makeProject } from '@revideo/core';
import dynamicScene from './scenes/dynamic';

export default makeProject({
  scenes: [dynamicScene],
  settings: {
    shared: {
      size: { x: 1920, y: 1080 },
    },
  },
});
