const boldButton = document.getElementById('boldButton');
const textEditor = document.getElementById('text-editor');
boldButton.addEventListener('click', () => {
  if(!textEditor.classList.contains('bolded')){
      textEditor.style.fontWeight = '700';
      textEditor.classList.add('bolded');
  }
  else {
    textEditor.style.fontWeight = '400';
    textEditor.classList.remove('bolded');
  }
});
