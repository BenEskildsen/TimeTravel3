const React = require('react');
const {useState, useEffect} = React;

// props:
// id: ?string
// label: string
// onClick: () => void
// onMouseDown: optional () => void
// onMouseUp: optional () => void
// disabled: optional boolean
// style: optional Object

function Button(props) {
  const id = props.id || props.label;

  const touchFn = () => {
    if (props.onMouseDown != null) {
      props.onMouseDown();
    } else {
      props.onClick();
    }
  }
  const [intervalID, setIntervalID] = useState(null);

  return (
    <button type="button"
      style={{
        touchAction: 'initial',
        fontSize: '18px',
        ...props.style,
      }}
      key={id || label}
      className={props.disabled ? 'buttonDisable' : ''}
      id={id.toUpperCase() + '_button'}
      onClick={props.disabled ? () => {} : props.onClick}
      onTouchStart={(ev) => {
        // ev.preventDefault();
        // if (intervalID) {
        //   clearInterval(intervalID);
        //   setIntervalID(null);
        // }
        // touchFn();
      }}
      onTouchEnd={(ev) => {
        // ev.preventDefault();
        // clearInterval(intervalID);
        // setIntervalID(null);
        // props.onMouseUp;
      }}
      onTouchCancel={(ev) => {
        // clearInterval(intervalID);
        // setIntervalID(null);
        // props.onMouseUp;
      }}
      onTouchMove={(ev) => {
        ev.preventDefault();
      }}
      onMouseDown={props.onMouseDown}
      onMouseUp={props.onMouseUp}
      disabled={props.disabled}
    >
      {props.label}
    </button>
  );
}

module.exports = Button;
