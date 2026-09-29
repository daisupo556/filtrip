(() => {
 const holder = document.querySelector('.device-holder');
 const phone = document.querySelector('.phone');
 function resizePhone() {
  const mobile = innerWidth < 820;
  const presenting = document.body.dataset.mode === 'story';
  const width = mobile ? innerWidth - 24 : innerWidth < 1100 ? 400 : 440;
  const height = presenting ? (mobile ? Math.max(300,innerHeight-370) : Math.max(420,innerHeight-195)) : mobile ? 868 : Math.max(640, innerHeight - 110);
  const scale = Math.min(1, width / 414, height / 868);
  holder.style.width = `${414 * scale}px`;
  holder.style.height = `${868 * scale}px`;
  phone.style.transform = `scale(${scale})`;
 }
 addEventListener('resize',resizePhone,{passive:true});
 resizePhone();
})();
