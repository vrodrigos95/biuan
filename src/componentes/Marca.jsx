export default function Marca({ grande = false }) {
  return (
    <div className={grande ? 'marca marca-grande' : 'marca'} aria-label="Biuan">
      Bi<span>uan</span>
    </div>
  )
}
