'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/store';
import { campaigns } from '@/data/dreamCampaigns';
import { campaignAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import BackNavigation from '@/components/BackNavigation';

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const { openSignupModal, currency } = useUIStore();
  const [quantity, setQuantity] = useState(1);
  const [remainingLimit, setRemainingLimit] = useState<number | null>(null);
  const [limitMessage, setLimitMessage] = useState('');
  const isDevUser = !!user?.id?.startsWith('dev_');
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);
  const [quizPassed, setQuizPassed] = useState(false);

  const campaign = useMemo(() => campaigns.find((item) => item.id === params?.id), [params?.id]);
  const quizQuestions = useMemo(
    () => [
      {
        question: 'What is used to verify land ownership?',
        options: ['EC (Encumbrance Certificate)', 'Electricity bill', 'Passport'],
        correctIndex: 0,
      },
      {
        question: 'What is a common use of land?',
        options: ['Farming', 'Email', 'Software'],
        correctIndex: 0,
      },
    ],
    []
  );

  useEffect(() => {
    const loadLimit = async () => {
      if (!campaign) return;
      if (isDevUser) {
        try {
          const raw = localStorage.getItem('af_dev_campaign_purchases');
          const map = raw ? JSON.parse(raw) as Record<string, number> : {};
          const purchased = map[campaign.id] || 0;
          const remaining = Math.max(0, 3 - purchased);
          setRemainingLimit(remaining);
          if (remaining <= 0) {
            setLimitMessage('Maximum participation limit reached for this campaign');
          } else if (remaining < 3) {
            setLimitMessage(`You can access up to ${remaining} more for this campaign`);
          } else {
            setLimitMessage('');
          }
        } catch {
          setRemainingLimit(3);
          setLimitMessage('');
        }
        return;
      }
      try {
        const res = await campaignAPI.limit(campaign.id);
        const remaining = Number(res.data?.data?.remaining_limit ?? 3);
        setRemainingLimit(remaining);
        if (remaining <= 0) {
          setLimitMessage('Maximum participation limit reached for this campaign');
        } else if (remaining < 3) {
          setLimitMessage(`You can access up to ${remaining} more for this campaign`);
        } else {
          setLimitMessage('');
        }
      } catch {
        setRemainingLimit(3);
        setLimitMessage('');
      }
    };
    if (token || user) loadLimit();
    else setRemainingLimit(3);
    const onPurchase = () => loadLimit();
    window.addEventListener('campaign:purchase', onPurchase);
    return () => {
      window.removeEventListener('campaign:purchase', onPurchase);
    };
  }, [campaign, token, user, isDevUser]);

  useEffect(() => {
    setQuizPassed(false);
  }, [campaign?.id]);

  useEffect(() => {
    if (remainingLimit === null) return;
    if (remainingLimit <= 0) return;
    if (quantity > remainingLimit) setQuantity(remainingLimit);
  }, [remainingLimit, quantity]);

  if (!campaign) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-slate-500">Campaign not found.</p>
      </div>
    );
  }

  const totalAmount = campaign.creditPack * quantity;
  const maxSelectable = remainingLimit === null ? 10 : Math.min(10, remainingLimit);

  const onProceed = () => {
    if (remainingLimit !== null && remainingLimit <= 0) return;
    if (!quizPassed) {
      setShowQuiz(true);
      return;
    }
    if (!user) {
      openSignupModal(() => router.push(`/campaigns/${campaign.id}/checkout?qty=${quantity}`));
      return;
    }
    router.push(`/campaigns/${campaign.id}/checkout?qty=${quantity}`);
  };

  const handleSubmitQuiz = () => {
    if (selectedAnswer === null) {
      setQuizFeedback('Please select an answer.');
      return;
    }
    const current = quizQuestions[quizIndex];
    if (selectedAnswer === current.correctIndex) {
      if (quizIndex < quizQuestions.length - 1) {
        setQuizFeedback('Correct. Continue to the next step.');
        setTimeout(() => {
          setQuizIndex((i) => i + 1);
          setSelectedAnswer(null);
          setQuizFeedback(null);
        }, 500);
      } else {
        setQuizFeedback("You're all set! Continue to checkout.");
        setQuizPassed(true);
      }
    } else {
      setQuizFeedback(`Incorrect. Correct answer: ${current.options[current.correctIndex]}`);
    }
  };

  const handleContinue = () => {
    setShowQuiz(false);
    if (quizPassed) {
      if (campaign) {
        sessionStorage.setItem(`af_quiz_token_${campaign.id}`, '1');
      }
      router.push(`/campaigns/${campaign?.id}/checkout?qty=${quantity}`);
    }
  };

  return (
    <div className="page-enter mx-auto max-w-6xl px-6 py-10">
      <BackNavigation />

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-80 rounded-2xl object-cover border border-slate-200" />
          <h1 className="mt-6 text-3xl font-black text-slate-900">{campaign.title}</h1>
          <p className="text-xs uppercase tracking-wide text-primary-700 font-semibold mt-2">Featured Land Opportunity</p>
          <p className="text-sm text-slate-600 mt-2">{campaign.location}</p>
          <p className="mt-4 text-slate-600">{campaign.description}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Credit Pack</p>
          <h2 className="text-3xl font-black text-primary-700 mt-1">{formatCurrency(campaign.creditPack, currency)} Asset Credits</h2>

          <p className="text-sm text-slate-500 mt-5">Select number of credit packs</p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {Array.from({ length: maxSelectable }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setQuantity(n)}
                className={`rounded-lg py-2 text-sm font-bold ${n === quantity ? 'bg-primary-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >{n}</button>
            ))}
          </div>

          {limitMessage && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {limitMessage}
            </div>
          )}

          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-600">Total</p>
            <p className="text-3xl font-black text-slate-900">{formatCurrency(totalAmount, currency)}</p>
          </div>

          <button
            onClick={onProceed}
            disabled={remainingLimit !== null && remainingLimit <= 0}
            className="mt-5 w-full rounded-xl bg-primary-700 text-white py-3 font-bold hover:bg-primary-800 transition disabled:opacity-60"
          >
            Proceed to Checkout
          </button>

          <p className="mt-4 text-xs text-slate-500">You are purchasing Asset Credits. Campaign benefits are complimentary.</p>
        </div>
      </div>

      {showQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">Step {quizIndex + 1} of {quizQuestions.length}</p>
                <h3 className="text-2xl font-black text-slate-900 mt-2">Quick Knowledge Check</h3>
                <p className="text-sm text-slate-500 mt-1">Complete this step to continue</p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuiz(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-6">
              <p className="text-sm font-bold text-slate-900">{quizQuestions[quizIndex].question}</p>
              <div className="mt-3 space-y-2">
                {quizQuestions[quizIndex].options.map((option, idx) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSelectedAnswer(idx)}
                    className={`w-full text-left rounded-xl border px-4 py-3 text-sm font-semibold ${selectedAnswer === idx ? 'border-primary-700 bg-primary-50 text-primary-800' : 'border-slate-200 text-slate-700'
                      }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {quizFeedback && (
              <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${quizFeedback.startsWith('Incorrect') ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {quizFeedback}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSubmitQuiz}
                className="flex-1 rounded-xl bg-primary-700 text-white py-3 text-sm font-bold"
              >
                Submit Answer
              </button>
              <button
                type="button"
                onClick={handleContinue}
                disabled={!quizPassed}
                className="flex-1 rounded-xl border border-primary-700 text-primary-700 py-3 text-sm font-bold disabled:opacity-60"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
