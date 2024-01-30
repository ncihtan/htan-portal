import { observable, IObservableValue, action } from 'mobx';
import _ from 'lodash';

export function DebouncedObservable<T>(initValue: T, delayMs: number) {
    let realTimeValue: IObservableValue<T> = observable.box(initValue);
    let debouncedValue: IObservableValue<T> = observable.box(initValue);

    const scheduleUpdate = _.debounce(
        action(() => {
            debouncedValue.set(realTimeValue.get());
        }),
        delayMs
    );

    return {
        set: (t: T) => {
            realTimeValue.set(t);
            scheduleUpdate();
        },
        get debouncedValue() {
            return debouncedValue.get();
        },
        get realTimeValue() {
            return realTimeValue.get();
        },
    };
}

export default DebouncedObservable;
