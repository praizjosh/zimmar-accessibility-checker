export default function solidFill(r: number, g: number, b: number, visible = true): Paint {
	return { type: "SOLID", visible, color: { r, g, b } } as Paint;
}
