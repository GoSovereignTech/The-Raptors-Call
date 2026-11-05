export function Wallet({ userGuid, coins }) {
  return (
    <div className="p-4 bg-slate-900 text-white rounded-xl">
      <h2 className="text-xl font-bold mb-2">Your Sparkle Wallet</h2>
      <div className="text-4xl font-black text-amber-400 mb-4">{coins} 🪙</div>
      
      <div className="bg-slate-800 p-4 rounded-lg">
        <h3 className="font-bold text-sm mb-2">Redeem For:</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between"><span>Binoculars</span> <span>500 🪙</span></li>
          <li className="flex justify-between"><span>$20 Gumroad Discount</span> <span>1,000 🪙</span></li>
          <li className="flex justify-between"><span>Raptor Radar</span> <span>5,000 🪙</span></li>
        </ul>
      </div>
      
      <p className="mt-4 text-xs text-slate-400">
        Your GUID: {userGuid} <br/>
        Keep this safe. Coins are tied to this device.
      </p>
    </div>
  );
}