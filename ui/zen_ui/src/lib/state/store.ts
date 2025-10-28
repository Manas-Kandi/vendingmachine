import { useEffect, useSyncExternalStore } from "react";

type Subscriber<T> = (value: T) => void;

export type WritableStore<T> = {
  subscribe: (subscriber: Subscriber<T>) => () => void;
  set: (value: T) => void;
  update: (updater: (value: T) => T) => void;
  get: () => T;
};

export const createStore = <T>(initial: T): WritableStore<T> => {
  let state = initial;
  const subscribers = new Set<Subscriber<T>>();

  const notify = () => {
    for (const subscriber of subscribers) {
      subscriber(state);
    }
  };

  return {
    subscribe(subscriber) {
      subscribers.add(subscriber);
      subscriber(state);
      return () => subscribers.delete(subscriber);
    },
    set(value) {
      state = value;
      notify();
    },
    update(updater) {
      state = updater(state);
      notify();
    },
    get() {
      return state;
    },
  };
};

export const useStore = <T>(store: WritableStore<T>) => {
  const subscribe = (callback: (value: T) => void) =>
    store.subscribe(callback);

  const getSnapshot = () => store.get();

  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return value;
};

export const useStoreEffect = <T>(
  store: WritableStore<T>,
  effect: (value: T) => void,
) => {
  useEffect(() => store.subscribe(effect), [store, effect]);
};
