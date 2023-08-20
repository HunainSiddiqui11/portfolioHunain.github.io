import { BIG_FACTOR, isRef, pathToStringPath } from './utils'
import { toposort } from './toposort'
import { Ref } from './types'
import { Queue } from './Queue'

const getAllInvalidations = (invalidations: Set<string>, index: Map<string, Set<string>>) => {
	const allInvalidations: Set<string> = new Set<string>()
	const queue = new Queue<Set<string>>(BIG_FACTOR)
	queue.enqueue(invalidations)
	while (!queue.isEmpty()) {
		const paths = queue.dequeue()
		for (const p of paths) {
			if (allInvalidations.has(p)) {
				continue
			}

			allInvalidations.add(p)
			const value = index.get(p)
			if (value) {
				queue.enqueue(value)
			}
		}
	}
	return allInvalidations
}

export class DependencyIndex {
	private index: Map<string, Set<string>> = new Map()

	addRefToIndex(ref: Ref<any>, ownRefPath: string) {
		const refPath = pathToStringPath(ref.refPath)
		if (!this.index.has(refPath)) {
			this.index.set(refPath, new Set<string>())
		}
		this.index.get(refPath)!.add(ownRefPath)
	}

	removeRefFromIndex(ref: unknown, ownRefPath: string) {
		if (isRef(ref)) {
			const refPath = pathToStringPath(ref.refPath)
			this.index.get(refPath)?.delete(ownRefPath)

			return true
		}
	}

	toposort(nodes: Set<string>) {
		return toposort(nodes, this.index)
	}

	getAllInvalidations(invalidations: Set<string>) {
		return getAllInvalidations(invalidations, this.index)
	}
}
