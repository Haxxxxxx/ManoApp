import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import {
  PlanId,
  FeatureKey,
  Plan,
  getPlan,
  DEFAULT_PLAN,
} from '../config/plans';

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'incomplete'
  | 'none';

export interface SubscriptionState {
  planId: PlanId;
  plan: Plan;
  status: SubscriptionStatus;
  currentPeriodEnd?: string;
  loading: boolean;
  /** True only while the subscription is active/usable */
  isActive: boolean;
  hasFeature: (key: FeatureKey) => boolean;
  /** check a numeric limit against a current count; true = allowed */
  withinLimit: (
    key: keyof Plan['limits'],
    currentCount: number
  ) => boolean;
}

const SubscriptionContext = createContext<SubscriptionState>({
  planId: DEFAULT_PLAN,
  plan: getPlan(DEFAULT_PLAN),
  status: 'none',
  loading: true,
  isActive: false,
  hasFeature: () => false,
  withinLimit: () => true,
});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [planId, setPlanId] = useState<PlanId>(DEFAULT_PLAN);
  const [status, setStatus] = useState<SubscriptionStatus>('none');
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setPlanId(DEFAULT_PLAN);
      setStatus('none');
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = doc(db, 'subscriptions', currentUser.uid);
    // Live subscription so a successful checkout/webhook updates the UI instantly
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setPlanId((data.planId as PlanId) ?? DEFAULT_PLAN);
          setStatus((data.status as SubscriptionStatus) ?? 'none');
          setCurrentPeriodEnd(data.currentPeriodEnd as string | undefined);
        } else {
          setPlanId(DEFAULT_PLAN);
          setStatus('none');
          setCurrentPeriodEnd(undefined);
        }
        setLoading(false);
      },
      () => {
        // On error fall back to free — never block the app on billing reads
        setPlanId(DEFAULT_PLAN);
        setStatus('none');
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser]);

  const plan = getPlan(planId);
  // Free is always "usable"; paid plans require an active/non-expired status
  const isActive =
    planId === 'free' || status === 'active' || status === 'past_due';

  const hasFeature = (key: FeatureKey): boolean =>
    isActive && Boolean(plan.features[key]);

  const withinLimit = (
    key: keyof Plan['limits'],
    currentCount: number
  ): boolean => {
    const limit = plan.limits[key];
    if (limit === -1) return true; // unlimited
    return currentCount < limit;
  };

  return (
    <SubscriptionContext.Provider
      value={{
        planId,
        plan,
        status,
        currentPeriodEnd,
        loading,
        isActive,
        hasFeature,
        withinLimit,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
