function Info(props: InfoProps) {
  const { title, description, isTouchDevice } = props;
  return (
    <div className="l-controls__info">
      <h2>{title}</h2>
      <p>{!isTouchDevice && description}</p>
    </div>
  );
}
export default Info;
