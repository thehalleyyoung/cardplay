import { createArrangementPanelState, addMarkerAtPosition, moveMarker } from './src/ui/components/arrangement-panel.ts';
import { asTick } from './src/types/primitives.ts';

let state = createArrangementPanelState();
state = addMarkerAtPosition(state, asTick(480), 'First');
state = addMarkerAtPosition(state, asTick(960), 'Second');
state = addMarkerAtPosition(state, asTick(1440), 'Third');

console.log('Before move:');
state.markers.forEach((m, i) => console.log(`  ${i}: ${m.name} at ${m.position}`));

const secondMarkerId = state.markers[1].id;
console.log(`Moving marker ${secondMarkerId} to 1680`);

state = moveMarker(state, secondMarkerId, asTick(1680));

console.log('After move:');
state.markers.forEach((m, i) => console.log(`  ${i}: ${m.name} at ${m.position}`));
