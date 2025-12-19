'use client';

import * as React from 'react';
import { ReactSketchCanvas, type ReactSketchCanvasRef } from 'react-sketch-canvas';

interface DrawingCanvasProps {
    tool: 'pencil' | 'brush' | 'eraser';
    onUpdate: (data: any) => void;
    initialData?: any;
}

const DrawingCanvas = React.forwardRef<ReactSketchCanvasRef, DrawingCanvasProps>(
    ({ tool, onUpdate, initialData }, ref) => {
        const internalRef = React.useRef<ReactSketchCanvasRef>(null);

        React.useImperativeHandle(ref, () => internalRef.current as ReactSketchCanvasRef);

        React.useEffect(() => {
            if (initialData && internalRef.current) {
                // react-sketch-canvas loadPaths expects the path object
                internalRef.current.loadPaths(initialData);
            }
        }, [initialData]);

        // Determine props based on tool
        const strokeWidth = tool === 'brush' ? 8 : 2;
        const eraserWidth = 20;

        // We toggle erase mode by referencing the canvas ref in parent usually, 
        // but ReactSketchCanvas has an 'eraseMode' prop in some versions?? 
        // Checking recent docs: It usually simply accepts `strokeColor` or we use `eraseMode={true}`.
        // Actually, newer versions rely on `canvasRef.current.eraseMode(boolean)`.
        // Let's use a side effect to set erase mode.

        React.useEffect(() => {
            if (internalRef.current) {
                internalRef.current.eraseMode(tool === 'eraser');
            }
        }, [tool]);

        const handleStroke = () => {
            internalRef.current?.exportPaths().then((paths) => {
                onUpdate(paths);
            });
        };

        return (
            <ReactSketchCanvas
                ref={internalRef}
                strokeWidth={strokeWidth}
                strokeColor="#000000"
                eraserWidth={eraserWidth}
                canvasColor="#ffffff"
                onStroke={handleStroke}
                style={{ border: 'none', width: '100%', height: '100%' }}
            />
        );
    }
);

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;
