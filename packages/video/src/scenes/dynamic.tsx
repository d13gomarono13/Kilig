import { makeScene2D, Rect, Circle, Txt, Layout, Img, Line, Latex, Grid, Spline } from '@revideo/2d';
import { createRef, all, waitFor, useScene, Reference } from '@revideo/core';

// Map schema types to Revideo components
const ComponentMap: Record<string, any> = {
    Rect,
    Circle,
    Text: Txt,
    Layout,
    Img,
    Line,
    Latex,
    Grid,
    Spline
};

export default makeScene2D('dynamic', function* (view) {
    // Access the sceneGraph passed via inputProps (variables)
    // ReVideo variables are signals, so we call them to get value
    const sceneGraphSignal = useScene().variables.get('sceneGraph', (): any => null);
    const sceneGraph = (sceneGraphSignal ? sceneGraphSignal() : null) as any;

    if (!sceneGraph || !sceneGraph.scenes) {
        view.add(
            <Layout layout direction="column" alignItems="center" justifyContent="center" width="100%" height="100%">
                <Txt
                    text="Waiting for SceneGraph..."
                    fill="#ffffff"
                    fontFamily="Space Grotesk"
                    fontWeight={700}
                    fontSize={40}
                />
                <Txt
                    text="(Run the pipeline to generate visuals)"
                    fill="#ffffff"
                    opacity={0.6}
                    fontFamily="Space Mono"
                    fontSize={20}
                    marginTop={20}
                />
            </Layout>
        );
        yield* waitFor(5);
        return;
    }

    // Iterate through scenes defined in JSON
    for (const scene of sceneGraph.scenes) {
        const sceneContainer = createRef<Layout>();
        const animations: Array<() => any> = [];

        // Recursive function to render nodes
        const renderNode = (node: any, idx: number): any => {
            const Component = ComponentMap[node.type] || Rect;
            const ref = createRef<any>();

            // Collect animations for this node
            if (node.animations) {
                node.animations.forEach((anim: any) => {
                    // Push a generator function wrapper
                    animations.push(function* () {
                        // Parse prop path e.g. "position.x" -> ref().position.x
                        const propPath = anim.prop.split('.');
                        let targetSignal = ref();

                        // Traverse to the signal
                        for (const p of propPath) {
                            if (targetSignal && targetSignal[p]) {
                                targetSignal = targetSignal[p];
                            }
                        }

                        // Check if it's a function (signal) we can tween
                        if (typeof targetSignal === 'function') {
                            // Apply tween
                            yield* targetSignal(anim.target, anim.duration, (anim.easing as any)); // Simple easing handling
                        }
                    });
                });
            }

            return (
                <Component key={idx} ref={ref} {...node.props}>
                    {node.children?.map((child: any, i: number) => renderNode(child, i))}
                </Component>
            );
        };

        // Add scene to view
        view.add(
            <Layout ref={sceneContainer} width="100%" height="100%">
                {/* Background */}
                <Rect width="100%" height="100%" fill={scene.background || '#000000'} />

                {/* Nodes */}
                {scene.root_nodes.map((node: any, i: number) => renderNode(node, i))}
            </Layout>
        );

        // Fade in scene container
        yield* sceneContainer().opacity(0, 0).to(1, 0.5);

        if (animations.length > 0) {
            // Execute all animations concurrently
            yield* all(...animations.map(a => a()));
        } else {
            // If no animations, just wait for duration
            yield* waitFor(scene.duration || 2);
        }

        // Fade out scene container before next scene
        yield* sceneContainer().opacity(0, 0.5);
        sceneContainer().remove();
    }
});
