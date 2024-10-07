const goToButton = (props: GoToButtonProps) => {
  const { title, targetTime, api } = props;
  return (
    <button
      type="button"
      className="gotobutton"
      onClick={(evt) => {
        evt.stopPropagation();
        api.seek(targetTime);
      }}
    >
      <h3>{title}</h3>
    </button>
  );
};
export default goToButton;
