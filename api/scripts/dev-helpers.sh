# Usage (from api/):  source scripts/dev-helpers.sh
setopt interactive_comments 2>/dev/null   # zsh: allow # comments in pasted commands

export B=localhost:4000/api/v1
export T=$B/tickets
export J='content-type: application/json'

# Print a JSON response readably
pp() { node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{console.log(JSON.stringify(JSON.parse(s),null,2))}catch{console.log(s)}})"; }

# login <email> <password>  → prints a token (or the error)
login() {
  local res
  res=$(curl -sS -X POST $B/auth/login -H "$J" -d "{\"email\":\"$1\",\"password\":\"$2\"}") || return 1
  echo "$res" | node -pe "const r=JSON.parse(require('fs').readFileSync(0)); r.data ? r.data.token : (console.error(JSON.stringify(r)), '')"
}

# ids <token>  → ticket ids visible to that user, oldest first
ids() {
  curl -s "$T?sort=oldest&pageSize=100" -H "Authorization: Bearer $1" |
    node -pe "const r=JSON.parse(require('fs').readFileSync(0)); r.data ? r.data.map(t=>t.id).join(' ') : (console.error(JSON.stringify(r)), '')"
}

export PRIYA=$(login priya.sharma@email.com author123)
export SNEHA=$(login sneha.kulkarni@email.com author123)
export ADMIN=$(login admin@bookleaf.com admin123)
echo "Tokens ready: PRIYA=${PRIYA:0:12}… SNEHA=${SNEHA:0:12}… ADMIN=${ADMIN:0:12}…"