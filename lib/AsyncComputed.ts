import { autorun, IReactionDisposer, observable, runInAction } from 'mobx';

export default function AsyncComputed<T>(
    computeValue: () => Promise<T>,
    initialValue: T
) {
    const value = observable.box<T>(initialValue, { deep: false });
    let latestRunId = 0; // prevent race conditions

    let reactionDisposer: IReactionDisposer | undefined = undefined;

    return {
        get: () => {
            if (!reactionDisposer) {
                reactionDisposer = autorun(() => {
                    latestRunId++;
                    const myRunId = latestRunId;
                    computeValue().then((result: T) => {
                        if (latestRunId === myRunId) {
                            // only update value if this is still the most recent call
                            runInAction(() => value.set(result));
                        }
                    });
                });
            }
            return value.get();
        },
        destroy: () => reactionDisposer && reactionDisposer(),
    };
}
