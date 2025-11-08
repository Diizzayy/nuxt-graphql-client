export default defineEventHandler(async () => {
  const ships = await GqlShips({ limit: 3 })

  return ships.ships
})
