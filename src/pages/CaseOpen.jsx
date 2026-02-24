import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet, rollItem, getRarityColor, getRarityGlow } from '../components/game/useWallet';
import CaseSpinner from '../components/game/CaseSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Coins, ArrowLeft, RefreshCw, Sparkles, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CaseOpen() {
  const params = new URLSearchParams(window.location.search);
  const caseId = params.get('id');
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const { user, balance, updateBalance, addXp } = useWallet();

  useEffect(() => {
    if (caseId) {
      base44.entities.CaseTemplate.filter({ id: caseId }).then(([data]) => {
        setCaseData(data);
        setLoading(false);
      });
    }
  }, [caseId]);

  const handleOpen = async () => {
    if (!caseData || spinning) return;
    if (balance < caseData.price) return;

    // Deduct cost
    await updateBalance(-caseData.price, 'case_purchase', `Opened ${caseData.name}`);

    // Roll item
    const wonItem = rollItem(caseData.items || []);
    setResult(wonItem);
    setSpinning(true);
    setShowResult(false);
  };

  const handleSpinComplete = async () => {
    setSpinning(false);
    setShowResult(true);

    if (result) {
      // Credit winnings
      await updateBalance(result.value, 'case_win', `Won ${result.name} from ${caseData.name}`);

      // Add to inventory
      await base44.entities.UserInventory.create({
        user_email: user.email,
        item_name: result.name,
        item_image_url: result.image_url,
        rarity: result.rarity,
        value: result.value,
        source: 'case_opening',
        source_case: caseData.name,
        status: 'owned',
      });

      // Add XP
      await addXp(Math.floor(caseData.price / 10));

      // Update case counter
      await base44.entities.CaseTemplate.update(caseData.id, {
        total_opened: (caseData.total_opened || 0) + 1
      });
    }
  };

  const handleTryAgain = () => {
    setResult(null);
    setShowResult(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-16">
        <Box className="w-16 h-16 text-white/10 mx-auto mb-4" />
        <p className="text-white/40 mb-4">Case not found</p>
        <Link to={createPageUrl('Cases')}>
          <Button variant="outline" className="border-white/10 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cases
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Cases')}>
          <Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/5 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{caseData.name}</h1>
          <p className="text-sm text-white/40">{caseData.description}</p>
        </div>
      </div>

      {/* Spinner */}
      <CaseSpinner
        items={caseData.items || []}
        result={result}
        spinning={spinning}
        onComplete={handleSpinComplete}
      />

      {/* Result Display */}
      <AnimatePresence>
        {showResult && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`glass rounded-2xl p-8 text-center border ${showResult ? 'border-white/10' : ''}`}
          >
            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${getRarityColor(result.rarity)} flex items-center justify-center mx-auto mb-4 ${getRarityGlow(result.rarity)} shadow-2xl`}>
              {result.image_url ? (
                <img src={result.image_url} alt="" className="w-20 h-20 object-contain" />
              ) : (
                <Sparkles className="w-10 h-10 text-white" />
              )}
            </div>
            <Badge className={`mb-3 bg-gradient-to-r ${getRarityColor(result.rarity)} text-white border-0 uppercase text-xs`}>
              {result.rarity}
            </Badge>
            <h2 className="text-xl font-bold text-white mb-1">{result.name}</h2>
            <p className="text-2xl font-bold text-amber-400">{result.value?.toLocaleString()} coins</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex justify-center gap-3">
        {showResult ? (
          <>
            <Button
              onClick={handleTryAgain}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl h-12 px-8"
            >
              <RefreshCw className="w-5 h-5 mr-2" /> Open Again ({caseData.price?.toLocaleString()} coins)
            </Button>
            <Link to={createPageUrl('Inventory')}>
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 rounded-xl h-12">
                View Inventory
              </Button>
            </Link>
          </>
        ) : (
          <Button
            onClick={handleOpen}
            disabled={spinning || balance < caseData.price}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl h-14 px-10 text-lg disabled:opacity-50"
          >
            {spinning ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Box className="w-5 h-5 mr-2" />
            )}
            {spinning ? 'Opening...' : `Open Case — ${caseData.price?.toLocaleString()} coins`}
          </Button>
        )}
      </div>

      {balance < caseData.price && !spinning && !showResult && (
        <p className="text-center text-red-400/80 text-sm">
          Not enough coins. <Link to={createPageUrl('Deposit')} className="text-violet-400 underline">Deposit more</Link>
        </p>
      )}

      {/* Case Contents */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Percent className="w-4 h-4 text-white/40" />
          <h3 className="text-lg font-semibold text-white">Case Contents</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(caseData.items || []).map((item, i) => (
            <div key={i} className={`glass rounded-xl p-4 text-center border ${item.rarity === result?.rarity && item.name === result?.name && showResult ? 'border-amber-400/40' : 'border-white/5'}`}>
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getRarityColor(item.rarity)} flex items-center justify-center mx-auto mb-2`}>
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="w-10 h-10 object-contain" />
                ) : (
                  <Sparkles className="w-5 h-5 text-white" />
                )}
              </div>
              <p className="text-xs font-medium text-white/80 mb-1">{item.name}</p>
              <p className="text-[10px] text-amber-400 font-semibold">{item.value?.toLocaleString()} coins</p>
              <p className="text-[10px] text-white/20 mt-1">{item.drop_rate}% chance</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}