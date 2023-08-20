type MarkType = 'PERMANENT' | 'TEMPORARY'

const MARKS: Record<string, MarkType> = {
	PERMANENT: 'PERMANENT',
	TEMPORARY: 'TEMPORARY',
}

export const toposort = (nodes: Set<string>, deps: Map<string, Set<string>>) => {
	const marks: Map<string, MarkType> = new Map()
	const output: Array<string> = new Array<string>(nodes.size)
	let i = nodes.size

	const visit = (node: string) => {
		const mark = marks.get(node)
		if (mark === MARKS.PERMANENT) {
			return
		}
		if (mark === MARKS.TEMPORARY) {
			throw new Error('Cyclic dependency')
		}
		marks.set(node, MARKS.TEMPORARY)
		if (deps.has(node)) {
			for (const dep of deps.get(node)!) {
				visit(dep)
			}
		}
		marks.set(node, MARKS.PERMANENT)
		--i
		output[i] = node
	}

	for (const node of nodes) {
		visit(node)
	}
	return output
}

// implement kahn's algorithm
export const toposort2 = (nodes: Set<string>, deps: Map<string, Set<string>>) => {
	const output: Array<string> = new Array<string>(nodes.size)
	let i = 0
	const queue: Array<string> = []
	const indegrees: Map<string, number> = new Map()

	for (const node of nodes) {
		if (!deps.has(node)) {
			queue.push(node)
		} else {
			indegrees.set(node, deps.get(node)!.size)
		}
	}

	while (queue.length > 0) {
		const node = queue.shift()!
		output[i++] = node
		if (deps.has(node)) {
			for (const dep of deps.get(node)!) {
				const indegree = indegrees.get(dep)!
				if (indegree === 1) {
					queue.push(dep)
				} else {
					indegrees.set(dep, indegree - 1)
				}
			}
		}
	}

	if (i !== nodes.size) {
		throw new Error('Cyclic dependency')
	}

	return output
}
